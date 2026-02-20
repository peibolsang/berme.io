"use client";

import dynamic from "next/dynamic";

type ConferencePdfViewerClientProps = {
  pdfPath: string;
  title: string;
};

const ConferencePdfViewer = dynamic(
  () =>
    import("./ConferencePdfViewer").then(
      (module) => module.ConferencePdfViewer,
    ),
  { ssr: false },
);

export const ConferencePdfViewerClient = ({
  pdfPath,
  title,
}: ConferencePdfViewerClientProps) => {
  return <ConferencePdfViewer pdfPath={pdfPath} title={title} />;
};
