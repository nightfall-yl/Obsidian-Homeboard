declare module "moment-parseformat" {
  const parseFormat: (input: string) => string;
  export default parseFormat;
}

declare module "diff-match-patch" {
  type Diff = [number, string];
  class diff_match_patch {
    diff_main(
      text1: string,
      text2: string,
      opt_checklines?: boolean,
      opt_deadline?: number
    ): Diff[];
  }
  type DiffMatchPatchModule = {
    diff_match_patch: typeof diff_match_patch;
    DIFF_DELETE: number;
    DIFF_INSERT: number;
    DIFF_EQUAL: number;
  };
  const DiffMatchPatch: DiffMatchPatchModule;
  export default DiffMatchPatch;
}