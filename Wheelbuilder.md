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


    ```
*  /peak/templates/components/products/add-to-cart-form.html
    {{#if product.options}}
    ....
         <button type="button" class="button button-secondary button-wide wb-reset-button">Reset Selection</button>
    {{/if}}

* templates/core/froms/options/set-rectangle.html
        {{display_name}} -> <span class="wb-option-display-name">{{display_name}}</span>