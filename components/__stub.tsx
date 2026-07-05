export const makeStub =
  (name: string) =>
  // biome-ignore lint/suspicious/noExplicitAny: generic convenience
  (props: any) => <div className="border border-dashed p-6 my-4 text-center text-gray-500">{name} placeholder</div>
