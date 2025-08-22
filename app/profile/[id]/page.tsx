import AppLayout from '../../components/AppLayout';
import ProfileWrapper from '@/_root/pages/ProfileWrapper';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  console.log('ProfilePage params debug:', { resolvedParams, id: resolvedParams.id });
  return (
    <AppLayout>
      <ProfileWrapper params={resolvedParams} />
    </AppLayout>
  );
}
