import SubmitEventForm from '@/components/events/submit-event-form';
// This route will be protected by middleware and dashboard layout

export default function SubmitEventPage() {
  return (
    <div>
      <SubmitEventForm />
    </div>
  );
}
