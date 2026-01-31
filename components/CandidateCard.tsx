import { Candidate } from "../lib/types";

type Props = {
  candidate: Candidate;
  onApprove: () => void;
  onReject: () => void;
};

export default function CandidateCard({ candidate, onApprove, onReject }: Props) {
  return (
    <div className="card">
      <h3>{candidate.name}</h3>
      <p>Student ID: {candidate.studentId}</p>
      <p>Email: {candidate.email}</p>

      {candidate.criteria && (
        <div>
          <h4>Criteria:</h4>
          <p><strong>Manifesto:</strong> {candidate.criteria.manifesto}</p>
          <p><strong>Vision:</strong> {candidate.criteria.vision}</p>
          <p><strong>Experience:</strong> {candidate.criteria.experience}</p>
        </div>
      )}

      <div className="actions">
        <button className="approveBtn" onClick={onApprove}>Approve</button>
        <button className="rejectBtn" onClick={onReject}>Reject</button>
      </div>
    </div>
  );
}