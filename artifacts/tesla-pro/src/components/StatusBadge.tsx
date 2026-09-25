import { Badge } from "./ui/badge";

type Status = 
  | "pending" 
  | "confirmed" 
  | "approved" 
  | "active" 
  | "rejected" 
  | "cancelled" 
  | "processing" 
  | "delivered"
  | "suspended"
  | "completed";

export function StatusBadge({ status }: { status: Status | string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let className = "";

  switch (status.toLowerCase()) {
    case "pending":
      className = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      break;
    case "confirmed":
    case "approved":
    case "active":
    case "completed":
    case "delivered":
      className = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      break;
    case "rejected":
    case "cancelled":
    case "suspended":
      className = "bg-destructive/10 text-destructive border-destructive/20";
      break;
    case "processing":
      className = "bg-blue-500/10 text-blue-500 border-blue-500/20";
      break;
    default:
      className = "bg-muted text-muted-foreground border-muted-foreground/20";
  }

  return (
    <Badge variant={variant} className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
