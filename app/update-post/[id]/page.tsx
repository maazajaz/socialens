import AppLayout from "../../components/AppLayout";
import EditPostWrapper from "../../../src/_root/pages/EditPostWrapper";

interface EditPostPageProps {
  params: { id: string };
}

export default function EditPostPage({ params }: EditPostPageProps) {
  return (
    <AppLayout>
      <EditPostWrapper postId={params.id} />
    </AppLayout>
  );
}
