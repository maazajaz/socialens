// Temporary code for debugging

export default function Page({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Profile Page for User</h1>
      <p>User ID: {params.id}</p>
    </div>
  );
}