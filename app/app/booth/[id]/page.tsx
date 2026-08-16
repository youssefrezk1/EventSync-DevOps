type BoothPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BoothPage({ params }: BoothPageProps) {
  const { id } = await params;

  return (
    <main>
      <h1>Booth</h1>
      <p>Booth ID: {id}</p>
    </main>
  );
}
