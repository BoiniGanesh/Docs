import ErrorScreen from "@/components/ErrorScreen";

/** Shown when a document doesn't exist or isn't shared with the current user (same message for both, by design). */
export default function DocumentNotFound() {
  return (
    <ErrorScreen
      title="Document not found"
      message="It may have been deleted, or it hasn't been shared with you. Ask the owner to share it with your account."
    />
  );
}
