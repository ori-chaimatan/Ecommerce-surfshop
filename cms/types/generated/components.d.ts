import type { Schema, Struct } from '@strapi/strapi';

export interface SharedButtonCta extends Struct.ComponentSchema {
  collectionName: 'components_shared_button_ctas';
  info: {
    displayName: 'ButtonCTA';
    icon: 'crown';
  };
  attributes: {
    LinkUrl: Schema.Attribute.String & Schema.Attribute.Required;
    targetLink: Schema.Attribute.Component<'shared.target', false>;
    Text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedCarouselHero extends Struct.ComponentSchema {
  collectionName: 'components_shared_carousel_heroes';
  info: {
    displayName: 'CarouselHero';
  };
  attributes: {
    BackgroundImg: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    Button: Schema.Attribute.Component<'shared.button-cta', false> &
      Schema.Attribute.Required;
    Title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedTarget extends Struct.ComponentSchema {
  collectionName: 'components_shared_targets';
  info: {
    displayName: 'target';
  };
  attributes: {
    targetLink: Schema.Attribute.Enumeration<['_blank', '_self']>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'shared.button-cta': SharedButtonCta;
      'shared.carousel-hero': SharedCarouselHero;
      'shared.target': SharedTarget;
    }
  }
}
