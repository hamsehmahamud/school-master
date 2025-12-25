
'use client';

interface PageTitleProps {
  title: string;
  description?: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && (
        <p className="text-lg text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
