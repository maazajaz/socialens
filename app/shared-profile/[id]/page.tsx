import ProfileWrapper from '../../../src/_root/pages/ProfileWrapper';

export default function SharedProfilePage({ params }: { params: { id: string } }) {
  // This page is public, so do not wrap in AppLayout or require authentication
  return <ProfileWrapper params={params} />;
}
