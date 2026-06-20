import { Button } from '../ui/button.jsx';

export default function FileUploader(props) {
  return (
    <label className="inline-flex">
      <Button type="button" variant="outline" asChild>
        <span>
          Upload file
          <input hidden type="file" {...props} />
        </span>
      </Button>
    </label>
  );
}

