import { FieldInput, FieldTextarea } from "../shared/Fields";
import ArrayEditor from "../shared/ArrayEditor";

const STEP_TEMPLATE = { number: "1", title: "Bước mới", description: "Mô tả bước..." };

export default function HowItWorksEditor({ data, onChange, sharedOnly, translationOnly }) {
  const upd = (key, val) => onChange({ ...data, [key]: val });

  const updStep = (idx, key, val) => {
    const steps = [...(data.steps || [])];
    steps[idx] = { ...steps[idx], [key]: val };
    upd("steps", steps);
  };

  return (
    <div>
      {!sharedOnly && (
        <>
          <FieldInput label="Nhãn (Badge)" value={data.badge} onChange={(v) => upd("badge", v)} placeholder="Hướng dẫn" />
          <FieldInput label="Tiêu đề section" value={data.title} onChange={(v) => upd("title", v)}
            placeholder="Cách hoạt động" />
        </>
      )}

      <ArrayEditor
        label="Các bước thực hiện"
        items={data.steps || []}
        onReorder={(v) => upd("steps", v)}
        addLabel="Thêm bước"
        hideControls={translationOnly}
        onAdd={() => upd("steps", [...(data.steps || []), { ...STEP_TEMPLATE }])}
        onRemove={(idx) => upd("steps", (data.steps || []).filter((_, i) => i !== idx))}
      >
        {(step, idx) => (
          <div className="grid grid-cols-4 gap-3">
            {!translationOnly && (
              <FieldInput label="Số thứ tự" value={step.number} onChange={(v) => updStep(idx, "number", v)} placeholder="1" />
            )}
            {!sharedOnly && (
              <>
                <div className="col-span-3">
                  <FieldInput label="Tiêu đề bước" value={step.title} onChange={(v) => updStep(idx, "title", v)} />
                </div>
                <div className="col-span-4">
                  <FieldTextarea label="Mô tả" value={step.description} onChange={(v) => updStep(idx, "description", v)} rows={2} />
                </div>
              </>
            )}
          </div>
        )}
      </ArrayEditor>
    </div>
  );
}
