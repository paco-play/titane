/**
 * Visual source of truth for the editor chrome.
 * Glass surfaces and density tokens live here so UCard / UModal / USidebar
 * inherit the look without per-template classes.
 */
const glassChrome = 'glass-panel bg-transparent ring-0 shadow-none';
const glassOverlay = glassChrome;
const glassStrong = 'glass-panel--strong bg-transparent ring-0 shadow-none';

/** Beats Nuxt UI's default `sm:p-6` so every surface shares --chrome-pad. */
const pad = 'p-(--chrome-pad) sm:p-(--chrome-pad)';
const padX = 'px-(--chrome-pad) sm:px-(--chrome-pad)';

/** Ring only — kills the elevated gray fill on outline fields. */
const fieldOutline =
  'bg-transparent hover:bg-transparent focus:bg-transparent disabled:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent dark:disabled:bg-transparent';

const fieldXs = {
  base: 'px-2 py-1 text-xxs/4 gap-1 h-6 md:text-xxs',
  leading: 'ps-2',
  trailing: 'pe-2',
  leadingIcon: 'size-3',
  trailingIcon: 'size-3'
};

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'navy',
      secondary: 'marine',
      neutral: 'zinc',
      warning: 'amber'
    },
    card: {
      slots: {
        root: 'rounded-lg overflow-hidden',
        header: pad,
        body: pad,
        footer: pad
      },
      variants: {
        variant: {
          outline: {
            root: glassChrome
          },
          soft: {
            root: `${glassOverlay} divide-white/10`
          },
          subtle: {
            root: `${glassOverlay} divide-white/10`
          }
        }
      },
      defaultVariants: {
        variant: 'outline'
      }
    },
    modal: {
      slots: {
        overlay: 'bg-black/40',
        content: `${glassStrong} divide-white/10`,
        header: pad,
        body: pad,
        footer: pad
      },
      variants: {
        fullscreen: {
          false: {
            content: 'rounded-lg shadow-none ring-0'
          }
        }
      }
    },
    slideover: {
      slots: {
        overlay: 'bg-black/40',
        content: `${glassStrong} divide-white/10 sm:ring-0 sm:shadow-none`,
        header: pad,
        body: pad,
        footer: pad
      },
      variants: {
        inset: {
          true: {
            content: 'rounded-lg'
          }
        }
      }
    },
    dropdownMenu: {
      slots: {
        content: `${glassOverlay} rounded-md overflow-hidden`
      },
      defaultVariants: {
        size: 'xs'
      }
    },
    contextMenu: {
      slots: {
        content: `${glassOverlay} rounded-md overflow-hidden`
      },
      defaultVariants: {
        size: 'xs'
      }
    },
    tooltip: {
      slots: {
        content: `${glassOverlay} rounded-md`
      }
    },
    popover: {
      slots: {
        content: `${glassOverlay} rounded-md`
      }
    },
    header: {
      slots: {
        root: 'glass-panel bg-transparent border-0 relative static h-max overflow-hidden rounded-lg z-10 backdrop-blur-none',
        container: `flex items-center justify-between gap-2 h-full max-w-none ${padX} lg:px-(--chrome-pad) py-(--chrome-pad-tight)`
      }
    },
    sidebar: {
      slots: {
        root: 'bg-transparent relative h-full min-h-0 [--sidebar-width:18rem]',
        header: `min-h-0 ${pad}`,
        container: 'relative static inset-auto z-10 flex h-full w-(--sidebar-width)',
        inner: 'glass-panel bg-transparent ring-0 shadow-none divide-white/10 overflow-hidden rounded-lg',
        body: `flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto ${pad}`
      },
      variants: {
        variant: {
          floating: {
            container: 'p-0 border-transparent',
            inner: 'rounded-lg ring-0 shadow-none'
          }
        },
        side: {
          left: {
            container: 'border-0'
          },
          right: {
            container: 'border-0'
          }
        }
      },
      defaultVariants: {
        variant: 'floating',
        collapsible: 'none'
      },
      compoundVariants: [
        {
          variant: 'floating',
          collapsible: 'none',
          class: {
            root: 'p-0'
          }
        }
      ]
    },
    input: {
      slots: {
        base: 'rounded-md'
      },
      variants: {
        variant: {
          outline: fieldOutline
        },
        size: {
          xs: fieldXs,
          sm: {
            base: 'px-1.5 py-0.5 text-xs/4 gap-1 md:text-xs'
          }
        }
      },
      compoundVariants: [
        {
          leading: true,
          size: 'xs',
          class: 'ps-7'
        },
        {
          trailing: true,
          size: 'xs',
          class: 'pe-7'
        }
      ],
      defaultVariants: {
        size: 'xs',
        color: 'neutral',
        variant: 'outline',
        fixed: true
      }
    },
    select: {
      slots: {
        base: 'rounded-md',
        content: `${glassOverlay} rounded-md overflow-hidden`
      },
      variants: {
        variant: {
          outline: fieldOutline
        },
        size: {
          xs: {
            ...fieldXs,
            item: 'p-1 text-xxs gap-1',
            itemLeadingIcon: 'size-3',
            itemTrailingIcon: 'size-3',
            trailingIcon: 'size-3'
          }
        }
      },
      compoundVariants: [
        {
          leading: true,
          size: 'xs',
          class: 'ps-7'
        },
        {
          trailing: true,
          size: 'xs',
          class: 'pe-7'
        }
      ],
      defaultVariants: {
        size: 'xs',
        color: 'neutral',
        variant: 'outline',
        fixed: true
      }
    },
    textarea: {
      slots: {
        base: 'rounded-md'
      },
      variants: {
        variant: {
          outline: fieldOutline
        },
        size: {
          xs: {
            base: 'px-1 py-0.5 text-xxs/4 gap-0.5 md:text-xxs'
          }
        }
      },
      defaultVariants: {
        size: 'xs',
        color: 'neutral',
        variant: 'outline',
        fixed: true
      }
    },
    button: {
      slots: {
        base: 'rounded-md'
      },
      variants: {
        size: {
          xs: {
            base: 'px-2 py-1 text-xxs gap-1 h-6',
            leadingIcon: 'size-3.5',
            trailingIcon: 'size-3.5'
          },
          sm: {
            base: 'px-1.5 py-0.5 text-xs gap-1',
            leadingIcon: 'size-3.5',
            trailingIcon: 'size-3.5'
          }
        }
      },
      compoundVariants: [
        {
          size: 'xs',
          square: true,
          class: 'p-0 size-6 justify-center'
        },
        {
          size: 'sm',
          square: true,
          class: 'p-1 justify-center'
        }
      ],
      defaultVariants: {
        size: 'xs'
      }
    },
    slider: {
      slots: {
        track: 'bg-white/20 rounded-full',
        thumb: 'bg-white ring-0'
      },
      variants: {
        size: {
          xs: {
            thumb: 'size-2'
          }
        }
      },
      compoundVariants: [
        {
          orientation: 'horizontal',
          size: 'xs',
          class: {
            track: 'h-0.5'
          }
        }
      ],
      defaultVariants: {
        size: 'xs',
        color: 'neutral'
      }
    },
    checkbox: {
      defaultVariants: {
        size: 'xs',
        color: 'primary'
      }
    },
    tree: {
      slots: {
        link: 'before:rounded-md'
      },
      variants: {
        size: {
          xs: {
            link: 'px-1 py-0.5 text-xxs gap-1'
          }
        },
        selected: {
          true: {
            link: 'before:bg-primary/25'
          }
        }
      },
      defaultVariants: {
        size: 'xs',
        color: 'primary'
      }
    },
    badge: {
      slots: {
        base: 'rounded-md'
      },
      defaultVariants: {
        size: 'xs',
        color: 'neutral',
        variant: 'subtle'
      }
    },
    separator: {
      variants: {
        color: {
          neutral: {
            border: 'border-white/10'
          }
        }
      }
    },
    collapsible: {
      slots: {
        root: 'rounded-md'
      }
    }
  }
});
