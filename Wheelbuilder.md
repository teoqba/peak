## Icon generator
https://icomoon.io/app/#/select
https://codepen.io/kenngsimply/pen/BWrrZy

## Implemented new Javascript
* assests/js/WheelbuilderFilters.js
    ** initialized in assests/js/theme/product/ProductUtils.js


## Changes in templates
* templates/core/forms/options/set-select.html
    ```
    {{display_name}} -> <span class="wb-option-display-name">{{display_name}}</span>
    
      <span class="wb-tooltip-icon" id="wb-tooltip-icon-{{display_name}}"> <svg class="icon icon-close icon-wb"><use xlink:href="#icon-tooltip"></use></svg></span>
      <span class="wb-tooltip" id="wb-tooltip-{{display_name}}"></span>
    
    
    class=wb-empty-option  //for Pick one... first option
    <option value="" class="wb-empty-option" {{#any values selected=true}}{{else}}selected{{/any}}>{{lang 'product.pick_one'}}</option>

    class=wb-option
    <option value="{{id}}" class="wb-option" {{#if selected}}selected{{/if}} data-product-attribute-value="{{id}}">


    data-wb-label="{{label}}"
        <option value="{{id}}" class="wb-option" {{#if selected}}selected{{/if}} data-product-attribute-value="{{id}}">{{label}}</option>

    ->
    <option value="{{id}}" class="wb-option" data-wb-label="{{label}}" {{#if selected}}selected{{/if}} data-product-attribute-value="{{id}}">{{label}}</option>


    commented out to avoid having "None" when options is not "Required" in OptionSet
              <!--{{#unless required}}-->
                <!--<option value="{{id}}" {{#if selected}}selected{{/if}} data-product-attribute-value="{{id}}">{{lang 'core.product.none'}}</option>-->
              <!--{{/unless}}-->

    ```
* templates/core/forms/options/swatch.html
    ```
    {{display_name}} -> <span class="wb-option-display-name">{{display_name}}</span>

      <span class="wb-tooltip-icon" id="wb-tooltip-icon-{{display_name}}"> <svg class="icon icon-close icon-wb"><use xlink:href="#icon-tooltip"></use></svg></span>
      <span class="wb-tooltip" id="wb-tooltip-{{display_name}}"></span>

    add data-wb-swatch-color="{{data.[0]}}" to label:
    <label class="swatch-wrap" data-swatch-value="{{label}}" data-wb-swatch-color="{{data.[0]}}" data-product-attribute-value="{{id}}">
    ```


*  /peak/templates/components/products/add-to-cart-form.html
    {{#if product.options}}
    ....
         <button type="button" class="button button-secondary button-wide wb-reset-button">Reset Selection</button>
    {{/if}}

    <div class="wb-step-label"> Step 1: Select Rim </div>

* templates/core/forms/options/set-rectangle.html
        {{display_name}} -> <span class="wb-option-display-name">{{display_name}}</span>

* templates/core/forms/options/input-text.html
        {{display_name}} -> <span class="wb-option-display-name">{{display_name}}</span>

* templates/core/forms/options/textarea.html
        {{display_name}} -> <span class="wb-option-display-name">{{display_name}}</span>
              <span class="wb-tooltip-icon" id="wb-tooltip-icon-{{display_name}}"> <svg class="icon icon-close icon-wb"><use xlink:href="#icon-tooltip"></use></svg></span>
              <span class="wb-tooltip" id="wb-tooltip-{{display_name}}"></span>

* templates/components/products/product-single-details.html
    <div id="wb-load-spinner"></div>


Changes in CSS:
/* Wheelbuilder options */
.wb-step-label {
  font-size: 20px;
  font-weight: bold;
}

Added spiner

### Aamir changes
1. template/pages/home.html (testimonial on home page is added)
2. template/components/common/home-testimonial.html (testimonial panel is added include this file)
3. template/components/footer/footer.html (Made changes in this file for social icons)
4. template/components/common/newsletter-signup.html (made changes in this file)
5. template/components/common/social-media-links.html (made changes in this file)
6. template/components/products/product-single-details.html (made changes in this file)
7. template/components/products/product-single-tabs.html (made changes in this file)
8. assets/js/theme/Home.js (testimonial script added in this file)
9. assets/scss/theme.scss (Custom style for product page and other added in this file at the end merge it.)
10. templates/components/products/additional-info.html
11. templates/core/geotrust-ssl-seal.html

### Added Enable/Disable option in Theme Configurator
* Modified files:
    * config.json
    * schema.json
    * video: https://www.youtube.com/watch?v=mdhSLKpTOBY  (around 11: discussion how to add checkbox)
    * templates/layout/base.html
        ```
            {{inject 'enableWheelbuilderFilters' theme_settings.wheelbuilder-filters}}
        ```
    * assets/js/theme/product/productUtils.js::init()
        ```
            this.wheelbuilderFilteringEnabled = this.context.enableWheelbuilderFilters;
        ```