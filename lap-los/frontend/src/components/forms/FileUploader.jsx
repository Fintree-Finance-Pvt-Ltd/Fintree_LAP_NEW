import { Button } from '@mui/material';

export default function FileUploader(props) {
  return <Button variant="outlined" component="label">Upload file<input hidden type="file" {...props} /></Button>;
}
