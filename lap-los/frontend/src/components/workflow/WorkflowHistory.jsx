import { List, ListItem, ListItemText } from '@mui/material';

export default function WorkflowHistory({ items = [] }) {
  return <List>{items.map((item) => <ListItem key={item.id} divider><ListItemText primary={`${item.fromStage} to ${item.toStage}`} secondary={item.remarks} /></ListItem>)}</List>;
}
