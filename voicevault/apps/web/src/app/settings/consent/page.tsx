"use client";

/**
 * Plain-language explanation of recording consent obligations.
 * Deliberately NOT legal advice — points users to their local law.
 */
export default function ConsentInfoPage() {
  return (
    <div className="card">
      <h1>Recording consent — what you should know</h1>
      <p>
        Laws about recording conversations differ by country, and often by
        state or province. Very broadly, jurisdictions fall into two camps:
      </p>
      <ul>
        <li>
          <strong>One-party consent</strong> — it is enough that <em>you</em>,
          as a participant, agree to the recording.
        </li>
        <li>
          <strong>All-party consent</strong> — <em>every</em> participant must
          agree before you record. Many jurisdictions (and most workplace and
          telehealth contexts) work this way.
        </li>
      </ul>
      <p>Practical guidance that is safe almost everywhere:</p>
      <ul>
        <li>Tell everyone, at the start, that you are recording — and why.</li>
        <li>Give people a chance to object before you begin.</li>
        <li>
          Use the built-in announcement tone (on by default for calls and
          meetings) so the notice is part of the recording itself.
        </li>
        <li>
          Check the acknowledgment box honestly — it is stored with the
          recording so you have a record of your own diligence.
        </li>
      </ul>
      <p className="muted">
        This page is general information, not legal advice. Rules vary widely
        (e.g. between US states, EU member states, and GCC countries) and
        change over time — check the law that applies where you and the other
        participants are located, or ask a lawyer.
      </p>
    </div>
  );
}
