"use strict";

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getByKey, setByKey } from "@/lib/setting"
import { toast } from "sonner";

export function SettingPage() {
  const STORE_ORIGIN_KEY = "storeOrigin"
  const savedOrigin = getByKey(STORE_ORIGIN_KEY)
  const [storeOrigin, setStoreOrigin] = useState(savedOrigin ? String(savedOrigin) : "")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setByKey(STORE_ORIGIN_KEY, storeOrigin);
    toast.success("Settings saved successfully.", {
      position: "top-center",
      duration: 1500,
    });
  };

  return (
    <div className="p-6">
      <form className="w-full md:w-1/3" onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Settings</FieldLegend>
            <FieldDescription>
              All settings are saved to local storage and will persist across sessions. You can clear them at any time.
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="storeOrigin">
                  Store Origin
                </FieldLabel>
                <Input
                  id="storeOrigin"
                  placeholder="e.g. https://examplestore.myshopify.com"
                  value={storeOrigin}
                  onChange={(event) => setStoreOrigin(event.target.value)}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit" className="ml-auto">
              Save
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
