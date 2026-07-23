import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import { launch } from 'puppeteer-core';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { ApiExecutionLog } from './entities/api-execution-log.entity';

type EndpointMetric = {
  method: string;
  endpoint: string;
  total: number;
  successful: number;
  failed4xx: number;
  failed5xx: number;
  averageLatencyMs: number;
  statuses: Record<string, number>;
};

type UserEndpointMetric = {
  userId: string;
  userName: string;
  userEmail: string;
  userRoles: string;
  method: string;
  endpoint: string;
  totalHits: string | number;
  avgLatencyMs: string | number;
  successHits: string | number;
  clientErrors: string | number;
  serverErrors: string | number;
};

@Injectable()
export class ApiAuditReportService {
  private readonly logger = new Logger(ApiAuditReportService.name);

  constructor(
    @InjectRepository(ApiExecutionLog)
    private readonly repository: Repository<ApiExecutionLog>,
  ) {}

  // Uses the server's local timezone, as requested.
  // @Cron('0 0 14 * * *', {
  //   name: 'daily-api-audit-report',
  //   timeZone: 'Asia/Kolkata',
  // })

  @Cron('0 59 23 * * *', {
  name: 'daily-api-audit-report',
  timeZone: 'Asia/Kolkata',
})
// for every min 

  //   @Cron('0 * * * * *', {
  //   name: 'daily-api-audit-report-test',
  //   timeZone: 'Asia/Kolkata',
  // })
  async runDailyReport() {
    try {
      this.logger.log('⏰ Daily API audit cron started at 2:00 PM IST.');

      const result = await this.generateReport();

      this.logger.log(
        `✅ Daily API audit PDF generated successfully: ${result.filePath}; requests=${result.totalRequests}, success=${result.successRate}%`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Daily API audit generation failed: ${error?.message || error}`,
        error?.stack,
      );
    }
  }

  async generateReport(now = new Date()) {
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const logs = await this.repository.find({
      where: { createdAt: MoreThanOrEqual(since) },
      order: { createdAt: 'ASC' },
    });
    const metrics = this.aggregate(logs);
    const userMetrics = await this.getUserEndpointMetrics(since, now);
    const date = this.localDate(now);
    const directory = join(process.cwd(), 'uploads', 'audit_logs');
    await fs.mkdir(directory, { recursive: true });
    const htmlPath = join(directory, `api_audit_${date}.html`);
    const filePath = join(directory, `api_audit_${date}.pdf`);
    const html = await this.renderHtml(metrics, userMetrics, logs, since, now);
    await fs.writeFile(htmlPath, html, { encoding: 'utf8', mode: 0o600 });
    await this.renderPdf(filePath, html);
    return { filePath, htmlPath, ...metrics.summary };
  }

  private aggregate(logs: ApiExecutionLog[]) {
    const grouped = new Map<string, EndpointMetric>();
    let successful = 0;
    let latencyTotal = 0;
    for (const log of logs) {
      const status = Number(log.statusCode);
      const key = `${log.method} ${log.endpoint}`;
      const item = grouped.get(key) || {
        method: log.method, endpoint: log.endpoint, total: 0, successful: 0,
        failed4xx: 0, failed5xx: 0, averageLatencyMs: 0, statuses: {},
      };
      item.total += 1;
      item.successful += status >= 200 && status < 400 ? 1 : 0;
      item.failed4xx += status >= 400 && status < 500 ? 1 : 0;
      item.failed5xx += status >= 500 ? 1 : 0;
      item.averageLatencyMs += Number(log.latencyMs || 0);
      item.statuses[String(status)] = (item.statuses[String(status)] || 0) + 1;
      grouped.set(key, item);
      successful += status >= 200 && status < 400 ? 1 : 0;
      latencyTotal += Number(log.latencyMs || 0);
    }
    const endpoints = [...grouped.values()]
      .map((item) => ({ ...item, averageLatencyMs: item.total ? Math.round(item.averageLatencyMs / item.total) : 0 }))
      .sort((a, b) => b.total - a.total || a.endpoint.localeCompare(b.endpoint));
    return {
      summary: {
        totalRequests: logs.length,
        successRate: logs.length ? Number(((successful / logs.length) * 100).toFixed(2)) : 0,
        averageLatencyMs: logs.length ? Math.round(latencyTotal / logs.length) : 0,
        failed4xx: logs.filter((log) => log.statusCode >= 400 && log.statusCode < 500).length,
        failed5xx: logs.filter((log) => log.statusCode >= 500).length,
      },
      endpoints,
    };
  }

  private async renderHtml(
    metrics: ReturnType<ApiAuditReportService['aggregate']>,
    userMetrics: UserEndpointMetric[],
    logs: ApiExecutionLog[],
    since: Date,
    now: Date,
  ) {
    const endpointRows = metrics.endpoints.map((item) => `<tr>
      <td><span class="badge badge-${this.escape(item.method.toLowerCase())}">${this.escape(item.method)}</span></td>
      <td><code>${this.escape(item.endpoint)}</code></td><td>${item.total.toLocaleString('en-IN')}</td>
      <td>${item.averageLatencyMs} ms</td><td>${Object.entries(item.statuses)
        .sort(([left], [right]) => Number(left) - Number(right))
        .map(([code, count]) => `<span class="status-${code[0]}xx">${code} ${this.statusText(Number(code))} (${count})</span>`)
        .join('<br>')}</td></tr>`).join('');

    const samples = [...logs]
      .sort((left, right) => {
        const leftFailed = left.statusCode >= 400 ? 1 : 0;
        const rightFailed = right.statusCode >= 400 ? 1 : 0;
        return rightFailed - leftFailed || right.createdAt.getTime() - left.createdAt.getTime();
      })
      .slice(0, 10);
    const logEntries = samples.map((log) => `<div class="log-entry"><div class="log-header">
      <span class="log-time">[${log.createdAt.toISOString()}]</span>
      <span class="badge badge-${this.escape(log.method.toLowerCase())}">${this.escape(log.method)}</span>
      <span class="log-endpoint">${this.escape(log.endpoint)}</span></div>
      <div class="code-block">REQUEST ID: ${this.escape(log.requestId || '-')}
AUTHORIZATION: Bearer [REDACTED]
REQUEST HEADERS/BODY/QUERY: [NOT COLLECTED]

RESPONSE STATUS: ${log.statusCode} ${this.statusText(log.statusCode)}
LATENCY: ${log.latencyMs} ms</div></div>`).join('');

    const templatePath = this.templatePath();
    let template = await fs.readFile(templatePath, 'utf8');
    const replacements: Record<string, string> = {
     REPORT_DATE: this.localDate(now),
WINDOW_START: this.formatIstDateTime(since),
WINDOW_END: this.formatIstDateTime(now),
      TOTAL_REQUESTS: metrics.summary.totalRequests.toLocaleString('en-IN'),
      SUCCESS_RATE: String(metrics.summary.successRate), AVERAGE_LATENCY: String(metrics.summary.averageLatencyMs),
      FAILED_4XX: String(metrics.summary.failed4xx), FAILED_5XX: String(metrics.summary.failed5xx),
      ENDPOINT_ROWS: endpointRows || '<tr><td colspan="5" class="empty">No API requests recorded in this period.</td></tr>',
      USER_API_SUMMARY_ROWS: this.buildUserApiSummaryRows(userMetrics),
      LOG_ENTRIES: logEntries || '<div class="empty">No execution samples recorded in this period.</div>',
    };
    for (const [key, value] of Object.entries(replacements)) {
      template = template.replaceAll(`{{${key}}}`, value);
    }
    return template;
  }

  private async getUserEndpointMetrics(since: Date, now: Date) {
    return this.repository.query<UserEndpointMetric[]>(`
      SELECT
        COALESCE(userId, 'ANONYMOUS') AS userId,
        COALESCE(userName, 'Anonymous') AS userName,
        COALESCE(userEmail, '-') AS userEmail,
        COALESCE(userRoles, '-') AS userRoles,
        method,
        endpoint,
        COUNT(*) AS totalHits,
        ROUND(AVG(latencyMs), 0) AS avgLatencyMs,
        SUM(CASE WHEN statusCode BETWEEN 200 AND 299 THEN 1 ELSE 0 END) AS successHits,
        SUM(CASE WHEN statusCode BETWEEN 400 AND 499 THEN 1 ELSE 0 END) AS clientErrors,
        SUM(CASE WHEN statusCode >= 500 THEN 1 ELSE 0 END) AS serverErrors
      FROM api_execution_logs
      WHERE created_at BETWEEN ? AND ?
      GROUP BY
        COALESCE(userId, 'ANONYMOUS'),
        COALESCE(userName, 'Anonymous'),
        COALESCE(userEmail, '-'),
        COALESCE(userRoles, '-'),
        method,
        endpoint
      ORDER BY totalHits DESC, userName ASC
    `, [since, now]);
  }

  private buildUserApiSummaryRows(rows: UserEndpointMetric[]) {
    if (!rows.length) {
      return '<tr><td colspan="7" class="empty">No user-wise API activity found for this window.</td></tr>';
    }
    return rows.map((row) => {
      const method = String(row.method || '').toLowerCase();
      const statusParts: string[] = [];
      if (Number(row.successHits || 0) > 0) {
        statusParts.push(`<span class="status-2xx">2xx (${Number(row.successHits)})</span>`);
      }
      if (Number(row.clientErrors || 0) > 0) {
        statusParts.push(`<span class="status-4xx">4xx (${Number(row.clientErrors)})</span>`);
      }
      if (Number(row.serverErrors || 0) > 0) {
        statusParts.push(`<span class="status-5xx">5xx (${Number(row.serverErrors)})</span>`);
      }
      return `<tr>
        <td><strong>${this.escape(row.userName || 'Anonymous')}</strong><br><small>ID: ${this.escape(row.userId || 'ANONYMOUS')}</small></td>
        <td>${this.escape(row.userEmail || '-')}<br><small>${this.escape(row.userRoles || '-')}</small></td>
        <td><span class="badge badge-${this.escape(method)}">${this.escape(String(row.method || '-').toUpperCase())}</span></td>
        <td><code>${this.escape(row.endpoint || '-')}</code></td>
        <td>${Number(row.totalHits || 0)}</td>
        <td>${Number(row.avgLatencyMs || 0)} ms</td>
        <td>${statusParts.join('<br>') || '-'}</td>
      </tr>`;
    }).join('');
  }

  private templatePath() {
    const compiled = join(__dirname, 'templates', 'api-audit.template.html');
    if (existsSync(compiled)) return compiled;
    return join(process.cwd(), 'src', 'modules', 'audit', 'templates', 'api-audit.template.html');
  }

  private statusText(status: number) {
    const labels: Record<number, string> = {
      200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content', 301: 'Moved Permanently',
      302: 'Found', 304: 'Not Modified', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
      404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Entity', 429: 'Too Many Requests',
      500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout',
    };
    return labels[status] || (status >= 500 ? 'Server Error' : status >= 400 ? 'Client Error' : status >= 300 ? 'Redirect' : 'Success');
  }

  private async renderPdf(filePath: string, html: string) {
    const executablePath = this.chromiumPath();
    const browser = await launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: '<div style="width:100%;padding:0 15mm;font:8px Arial;color:#64748b;display:flex;justify-content:space-between"><span>Confidential - Internal API Audit Log</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
      });
      await fs.chmod(filePath, 0o600);
    } finally {
      await browser.close();
    }
  }

  private chromiumPath() {
    const configured = process.env.CHROMIUM_EXECUTABLE_PATH;
    const candidates = [
      configured,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    ].filter(Boolean) as string[];
    const executable = candidates.find((candidate) => existsSync(candidate));
    if (!executable) {
      throw new Error('Chrome/Chromium was not found. Set CHROMIUM_EXECUTABLE_PATH on the server.');
    }
    return executable;
  }

  private localDate(value: Date) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.format(value);
  }

    private formatIstDateTime(value: Date) {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(value);
  }
  private escape(value: unknown) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
  }
}
