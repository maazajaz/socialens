import AppLayout from "../../components/AppLayout";
import UpdateProfileWrapper from "../../../src/_root/pages/UpdateProfileWrapper";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function UpdateProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = await params;
  
  return (
    <AppLayout>
      <UpdateProfileWrapper params={resolvedParams} />
    </AppLayout>
  );
}
