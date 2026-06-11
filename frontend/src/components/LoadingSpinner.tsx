type LoadingSpinnerProps = {
  message?: string;
  fullPage?: boolean;
};

export function LoadingSpinner({
  message = "Loading...",
  fullPage = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className="loading-inline">
      <span className="inline-spinner" aria-hidden="true" />
      <p className="sub">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <main className="dashboard-wrap page-stack">
        <section className="panel">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            {content}
          </div>
        </section>
      </main>
    );
  }

  return content;
}
