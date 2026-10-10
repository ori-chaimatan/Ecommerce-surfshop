import type { Schema, Struct } from '@strapi/strapi';

export interface CartLine extends Struct.ComponentSchema {
  collectionName: 'components_cart_lines';
  info: {
    description: 'One product + size in a cart. Price and stock are always read live from the product';
    displayName: 'Cart Line';
    icon: 'shoppingCart';
  };
  attributes: {
    Product: Schema.Attribute.Relation<'manyToOne', 'api::product.product'> &
      Schema.Attribute.Required;
    Quantity: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 99;
          min: 1;
        },
        number
      >;
    SizeKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 32;
      }>;
  };
}

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

export interface ProductBoardSize extends Struct.ComponentSchema {
  collectionName: 'components_product_board_sizes';
  info: {
    description: 'One purchasable surfboard size (length in feet + inches, volume), with its own stock';
    displayName: 'Board Size';
    icon: 'layer';
  };
  attributes: {
    LengthFt: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 4;
        },
        number
      >;
    LengthInches: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 11;
          min: 0;
        },
        number
      >;
    Stock: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    VolumeL: Schema.Attribute.Decimal & Schema.Attribute.Required;
  };
}

export interface ProductStandardSize extends Struct.ComponentSchema {
  collectionName: 'components_product_standard_sizes';
  info: {
    description: 'One purchasable apparel/accessory size, with its own stock';
    displayName: 'Standard Size';
    icon: 'layer';
  };
  attributes: {
    Size: Schema.Attribute.Enumeration<['S', 'M', 'L', 'XL', 'OneSize']> &
      Schema.Attribute.Required;
    Stock: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface ProductSurfboardSpecs extends Struct.ComponentSchema {
  collectionName: 'components_product_surfboard_specs';
  info: {
    description: 'Surfboard-only specs: skill level, fins and 0\u2013100 attribute scales';
    displayName: 'SurfboardSpecs';
    icon: 'star';
  };
  attributes: {
    Approach: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    Break: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    EntryRocker: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    ExitRocker: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    FinSetup: Schema.Attribute.Enumeration<
      ['Thruster', 'Twin', 'Quad', 'Single', 'TwoPlusOne']
    > &
      Schema.Attribute.Required;
    FinSetupNote: Schema.Attribute.Text;
    Foil: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    FootOrientation: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    NoseShape: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    Power: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    RockerStyle: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    SkillLevel: Schema.Attribute.Enumeration<
      ['Beginner', 'Intermediate', 'Advanced']
    > &
      Schema.Attribute.Required;
    TailWidth: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    Video: Schema.Attribute.Media<'videos'>;
    WaveSize: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
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
      'cart.line': CartLine;
      'home.hero-slide': HomeHeroSlide;
      'product.board-size': ProductBoardSize;
      'product.standard-size': ProductStandardSize;
      'product.surfboard-specs': ProductSurfboardSpecs;
      'shared.button-cta': SharedButtonCta;
      'shared.carousel-hero': SharedCarouselHero;
      'shared.target': SharedTarget;
    }
  }
}
