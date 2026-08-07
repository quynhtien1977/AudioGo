import { FieldInput, FieldTextarea } from "../shared/Fields";
import ArrayEditor from "../shared/ArrayEditor";

const STEP_TEMPLATE = { number: "1", title: "Bước mới", description: "Mô tả bước..." };

export default function HowItWorksEditor({ data, onChange }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  const updStep = (idx, key, val) => {
    const steps = [...(data.steps || [])];
    steps[idx] = { ...steps[idx], [key]: val };
    upd("steps", steps);
  };

  return (
    <div>
      <FieldInput label="Tiêu đề section" value={data.title} onChange={(v) => upd("title", v)}
        placeholder="Cách hoạt động" />

      <ArrayEditor
        label="Các bước"
        items={data.steps || []}
        addLabel="Thêm bước"
        onAdd={() => {
          const n = (data.steps || []).length + 1;
          upd("steps", [...(data.steps || []), { ...STEP_TEMPLATE, number: String(n) }]);
        }}
        onRemove={(idx) => upd("steps", (data.steps || []).filter((_, i) => i !== idx))}
      >
        {(step, idx) => (
          <div className="grid grid-cols-4 gap-3">
            <FieldInput label="Số thứ tự" value={step.number} onChange={(v) => updStep(idx, "number", v)} placeholder="1" />
            <div className="col-span-3">
              <FieldInput label="Tiêu đề bước" value={step.title} onChange={(v) => updStep(idx, "title", v)} />
            </div>
            <div className="col-span-4">
              <FieldTextarea label="Mô tả" value={step.description} onChange={(v) => updStep(idx, "description", v)} rows={2} />
            </div>
          </div>
        )}
      </ArrayEditor>
    </div>
  );
}
