export default () => ({
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  maxUploadSizeBytes: Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10) * 1024 * 1024
});
