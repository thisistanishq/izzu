export default function Home() {
  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>IzzU Identity Backend</h1>
      <p>
        Status: <strong>Running</strong>
      </p>
      <p>Port: 3001</p>
      <p>Endpoints: /api/v1/auth</p>
    </div>
  );
}
