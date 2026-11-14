'use client';

export function PrintButton() {
  return <button onClick={() => print()} className="btn p noprint">Save as PDF</button>;
}
