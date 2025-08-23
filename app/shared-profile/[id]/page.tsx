import SharedProfileWrapper from '../../../src/_root/pages/SharedProfileWrapper';

export default async function SharedProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  return (
    <SharedProfileWrapper params={resolvedParams} />
  );
}