## Implemented new Javascript
* assests/js/WheelbuilderFilters.js
    ** initialized in assests/js/theme/product/ProductUtils.js


## Changes in templates
* templates/core/froms/options/set-select.html
    ```
    {{display_name}} -> <span class="wb-option-display-name">{{display_name}}</span>
    
    class=wb-empty-option  //for Pick one... first optioon
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
*  /peak/templates/components/products/add-to-cart-form.html
    {{#if product.options}}
    ....
         <button type="button" class="button button-secondary button-wide wb-reset-button">Reset Selection</button>
    {{/if}}

    <div class="wb-step-label"> Step 1: Select Rim </div>

* templates/core/froms/options/set-rectangle.html
        {{display_name}} -> <span class="wb-option-display-name">{{display_name}}</span>


* templates/components/products/product-single-details.html
    <div id="wb-load-spinner"></div>


Changes in CSS:
/* Wheelbuilder options */
.wb-step-label {
  font-size: 20px;
  font-weight: bold;
}
