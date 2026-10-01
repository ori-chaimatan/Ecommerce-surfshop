import type { Schema, Struct } from '@strapi/strapi';

export interface HomeHeroSlide extends Struct.ComponentSchema {
  collectionName: 'components_home_hero_slides';
  info: {
    description: 'One slide of the Home page hero carousel';
    displayName: 'Hero slide';
    icon: 'picture';
  };
  attributes: {
    ctaHref: Schema.Attribute.String & Schema.Attribute.Required;
    ctaLabel: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 40;
      }>;
    headline: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    Hero: Schema.Attribute.Component<'shared.carousel-hero', false>;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    subtext: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
  };
}

export interface SharedButtonCta extends Struct.ComponentSchema {
  collectionName: 'components_shared_button_ctas';
  info: {
    displayName: 'ButtonCTA';
    icon: 'crown';
  };
  attributes: {
    LinkUrl: Schema.Attribute.String;
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
    BackgroundImg: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    > &
      Schema.Attribute.Required;
    Button: Schema.Attribute.Component<'shared.button-cta', false>;
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
      'home.hero-slide': HomeHeroSlide;
      'shared.button-cta': SharedButtonCta;
      'shared.carousel-hero': SharedCarouselHero;
      'shared.target': SharedTarget;
    }
  }
}
