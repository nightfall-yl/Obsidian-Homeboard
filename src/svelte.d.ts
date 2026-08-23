declare module "*.svelte" {
  import type { SvelteComponent } from "svelte";
  const Comp: typeof SvelteComponent;
  export default Comp;
}
