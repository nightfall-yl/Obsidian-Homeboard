declare module "moment-parseformat" {
  const parseFormat: (input: string) => string;
  export default parseFormat;
}

declare module "diff-match-patch" {
  type Diff = [number, string];
  type DiffMatchPatchModule = {
    diff_match_patch: {
      diff_main(
        text1: string,
        text2: string,
        opt_checklines?: boolean,
        opt_deadline?: number
      ): Diff[];
    };
    DIFF_DELETE: number;
    DIFF_INSERT: number;
    DIFF_EQUAL: number;
  };
  const DiffMatchPatch: DiffMatchPatchModule;
  export default DiffMatchPatch;
}