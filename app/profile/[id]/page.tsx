import ProfileWrapper from '@/_root/pages/ProfileWrapper';
import AppLayout from '../../components/AppLayout';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <AppLayout>
      <ProfileWrapper params={resolvedParams} />
    </AppLayout>
  );
}
