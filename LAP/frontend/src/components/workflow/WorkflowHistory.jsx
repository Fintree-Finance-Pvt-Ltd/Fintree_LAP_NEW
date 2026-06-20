import { List, ListItem, ListItemText } from "../../components/ui/list.jsx";

export default function WorkflowHistory({ items = [] }) {
  return (
    <List>
      {items.map((item) => (
        <ListItem key={item.id}>
          <ListItemText
            primary={`${item.fromStage} to ${item.toStage}`}
            secondary={item.remarks}
          />
        </ListItem>
      ))}
    </List>
  );
}

