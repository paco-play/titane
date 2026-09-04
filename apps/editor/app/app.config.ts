export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      secondary: 'purple',
      neutral: 'mist'
    },
    header: {
      slots: {
        root: 'bg-default/75 backdrop-blur border-b border-default relative h-max',
        container: 'flex items-center justify-between gap-3 h-full max-w-none sm:px-2 lg:px-2 py-2'
      }
    },
    sidebar: {
      slots: {
        root: 'bg-default/75 backdrop-blur border-l border-default relative h-full min-h-0',
        header: 'min-h-none py-2',
        // Pin to the editor row. Default is fixed + h-svh and covers the Project panel.
        container: 'absolute inset-y-0 z-10 hidden h-full w-(--sidebar-width) lg:flex'
      }
    }
  }
})