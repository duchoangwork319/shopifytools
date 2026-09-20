import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { ButtonGroup } from "@/components/ui/button-group";
import { ChevronDownIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import type { FetchOptions } from "@/types/crawl";

export function FetchButtonGroup(
  {
    fetchOptions, fetchHandler
  }: {
    fetchOptions: FetchOptions,
    fetchHandler: (options: FetchOptions) => void
  }
) {
  const [innerFetchOptions, setInnerFetchOptions] = useState<FetchOptions>(fetchOptions);
  const [tempHandleSuffix, setTempHandleSuffix] = useState(fetchOptions.handleSuffix);
  const [tempAppendTags, setTempAppendTags] = useState(fetchOptions.appendTags);

  const handleSuffixRef = useRef<HTMLInputElement>(null);
  const appendTagsRef = useRef<HTMLInputElement>(null);

  const applyOptions = () => {
    const textOptions: Omit<FetchOptions, 'publishProducts' | 'inventoryPolicyContinue'> = {
      handleSuffix: handleSuffixRef.current?.value || "",
      appendTags: appendTagsRef.current?.value || "",
    };
    textOptions.appendTags = textOptions.appendTags.split(",").map(tag => tag.trim()).filter(Boolean).join(", ");
    setInnerFetchOptions(prev => ({ ...prev, ...textOptions }));
  };

  return (
    <ButtonGroup>
      <Button className="cursor-pointer" variant="outline" onClick={() => fetchHandler(innerFetchOptions)}>
        Fetch
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="pl-2! cursor-pointer">
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" onInteractOutside={applyOptions}>
          <FieldGroup className="w-full max-w-xs">
            <FieldSet>
              <FieldLabel>Visibility</FieldLabel>
              <FieldGroup data-slot="checkbox-group">
                <Field orientation="horizontal">
                  <Checkbox id="publish-products" checked={innerFetchOptions.publishProducts}
                    onCheckedChange={(checked: boolean) => setInnerFetchOptions(prev => ({ ...prev, publishProducts: checked }))} />
                  <FieldLabel htmlFor="publish-products" className="font-normal">
                    Publish products
                  </FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <Checkbox id="inventory-policy" checked={innerFetchOptions.inventoryPolicyContinue}
                    onCheckedChange={(checked: boolean) => setInnerFetchOptions(prev => ({ ...prev, inventoryPolicyContinue: checked }))} />
                  <FieldLabel htmlFor="inventory-policy" className="font-normal">
                    Inventory Policy Continue
                  </FieldLabel>
                </Field>
                <Field>
                  <FieldLabel htmlFor="handle-suffix">Handle Suffix</FieldLabel>
                  <FieldDescription>
                    Choose a unique suffix to be added to products after fetching.
                  </FieldDescription>
                  <Input id="handle-suffix" type="text" value={tempHandleSuffix} onChange={(e) => setTempHandleSuffix(e.target.value)}
                    placeholder="sales" ref={handleSuffixRef} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="append-tags">Append Tags</FieldLabel>
                  <FieldDescription>
                    Add additional tags to all products being fetched. Separate multiple tags with commas.
                  </FieldDescription>
                  <Input id="append-tags" type="text" value={tempAppendTags} onChange={(e) => setTempAppendTags(e.target.value)}
                    placeholder="preorder, sales" ref={appendTagsRef} />
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  );
}
