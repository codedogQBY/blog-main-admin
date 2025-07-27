import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CustomImageComponent from './CustomImageComponent.vue'

export interface ImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * Add an image
       */
      setImage: (options: {
        src: string
        alt?: string
        title?: string
        width?: number
        height?: number
        align?: 'left' | 'center' | 'right'
      }) => ReturnType
    }
  }
}

export const inputRegex = /(?:^|\s)(!\[(.+|:?)\]\((.+)\))$/

export const CustomImage = Node.create<ImageOptions>({
  name: 'customImage',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('width') || element.style.width
          return width ? parseInt(width) : null
        },
        renderHTML: attributes => {
          if (!attributes.width) {
            return {}
          }
          return {
            width: attributes.width,
            style: `width: ${attributes.width}px`,
          }
        },
      },
      height: {
        default: null,
        parseHTML: element => {
          const height = element.getAttribute('height') || element.style.height
          return height ? parseInt(height) : null
        },
        renderHTML: attributes => {
          if (!attributes.height) {
            return {}
          }
          return {
            height: attributes.height,
            style: `height: ${attributes.height}px`,
          }
        },
      },
      align: {
        default: 'center',
        parseHTML: element => {
          const align = element.getAttribute('data-align') || 
                       element.style.textAlign ||
                       (element.parentElement?.classList.contains('image-align-left') ? 'left' :
                        element.parentElement?.classList.contains('image-align-right') ? 'right' : 'center')
          return align
        },
        renderHTML: attributes => {
          if (!attributes.align) {
            return {}
          }
          return {
            'data-align': attributes.align,
            class: `image-align-${attributes.align}`,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setImage:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: match => {
          const [, , alt, src] = match
          return { src, alt }
        },
      }),
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(CustomImageComponent as any)
  },

})

export default CustomImage