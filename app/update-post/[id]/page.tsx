import AppLayout from "../../components/AppLayout";
import EditPostWrapper from "../../../src/_root/pages/EditPostWrapper";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const resolvedParams = await params;
  
  return (
    <AppLayout>
      <EditPostWrapper postId={resolvedParams.id} />
    </AppLayout>
  );
}
