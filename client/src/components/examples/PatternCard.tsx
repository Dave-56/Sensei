import { PatternCard } from '../PatternCard';

export default function PatternCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
      <PatternCard
        name="Product Questions"
        example="How do I upgrade my plan?"
        count={142}
        trend="up"
        onClick={() => console.log('Pattern clicked')}
      />
      <PatternCard
        name="Billing Issues"
        example="I was charged twice this month"
        count={38}
        trend="down"
      />
      <PatternCard
        name="Feature Requests"
        example="Can you add dark mode?"
        count={76}
        trend="up"
        isEmerging
      />
    </div>
  );
}
