/**
 * flex/examples.tsx
 * Copy-paste snippets showing every common pattern.
 */
import { Row, Col, Stack } from "./index";

// ─────────────────────────────────────────────
// 1. Basic 12-col grid  (like Bootstrap's row/col)
// ─────────────────────────────────────────────
export function TwoColLayout() {
  return (
    <Row gap={6}>
      <Col span={12} md={8}>Main content</Col>
      <Col span={12} md={4}>Sidebar</Col>
    </Row>
  );
}

// ─────────────────────────────────────────────
// 2. Three equal columns
// ─────────────────────────────────────────────
export function ThreeColCards() {
  return (
    <Row gap={4}>
      <Col span={12} md={4}>Card A</Col>
      <Col span={12} md={4}>Card B</Col>
      <Col span={12} md={4}>Card C</Col>
    </Row>
  );
}

// ─────────────────────────────────────────────
// 3. Offset / centred single column
// ─────────────────────────────────────────────
export function CentredForm() {
  return (
    <Row justify="center">
      <Col span={12} md={6}>
        <form>…</form>
      </Col>
    </Row>
  );
}

// ─────────────────────────────────────────────
// 4. Responsive Stack — button group
//    Stacks vertically on mobile, inline on md+
// ─────────────────────────────────────────────
export function ActionBar() {
  return (
    <Stack direction="vertical" align="center" justify="end" gap={3}>
      <button>Cancel</button>
      <button>Save draft</button>
      <button>Publish</button>
    </Stack>
  );
}

// ─────────────────────────────────────────────
// 5. Always-horizontal badge row
// ─────────────────────────────────────────────
export function BadgeRow() {
  return (
    <Stack direction="horizontal" gap={2} align="center">
      <span>Draft</span>
      <span>Urgent</span>
      <span>Reviewed</span>
    </Stack>
  );
}

// ─────────────────────────────────────────────
// 6. Nesting: Row > Col > Stack
// ─────────────────────────────────────────────
export function DashboardPanel() {
  return (
    <Row gap={6} align="start">
      <Col span={12} md={9}>
        {/* main area */}
        <Stack direction="vertical" gap={4}>
          <div>Chart</div>
          <div>Table</div>
        </Stack>
      </Col>
      <Col span={12} md={3}>
        {/* sidebar */}
        <Stack direction="vertical-only" gap={3}>
          <div>Widget A</div>
          <div>Widget B</div>
        </Stack>
      </Col>
    </Row>
  );
}
