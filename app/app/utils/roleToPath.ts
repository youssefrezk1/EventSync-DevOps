export function roleToDashboard(role: string): string {
  switch (role.toLowerCase()) {
    case "student":
      return "student";

    case "admin":
      return "admin";

    case "vendor":
      return "vendor";

    case "event-office": // backend uses event-office
      return "eventOffice"; // frontend folder is camelCase

    // All staff-like roles -> one folder
    case "staff":
    
    case "TA":
      return "staff";
    case "professor":
        return "professor";

    default:
      return "student"; // safe fallback
  }
}
