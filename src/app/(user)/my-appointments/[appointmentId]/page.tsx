import { AppointmentDetails } from "@/components/user/AppointmentDetails";

export default async function AppointmentDetailsPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  return <AppointmentDetails appointmentId={appointmentId} />;
}