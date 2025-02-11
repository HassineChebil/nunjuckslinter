# Nunjuckslinter
A Node linting tool for Nunjucks templates that helps maintain code quality and consistency.

## Installation

```bash
npm install nunjucklinter
```

## Usage
```bash
npx njklint <path-to-template> # Check for issues
npx njklint --fix <path-to-template> # Fix spacing issues automatically
```

## Configuration

Create a ```.njklintrc``` or ```njklint.config.json``` file in your project root:

```json
{
    "ignore": ["node_modules/**", "dist/**", "build/**"],
    "extensions": [".njk", ".html"],
    "customFilters": ["yourCustomFilter"],
    "rules": {
        "checkBlockStructure": true,
        "checkSyntaxBalance": true,
        "checkFilters": true,
        "checkSpacing": true
    }
}
```

## Available Rules

- ```checkBlockStructure``` : Validates proper nesting and closing of Nunjucks blocks
- ```checkSyntaxBalance``` : Ensures balanced delimiters
- ```checkFilters``` : Validates filter usage and existence
- ```checkSpacing``` : Enforces consistent spacing in templates

## Examples

### Block Structure Validation
```njk
{% block content %}
    <h1>Title</h1>
{% endblock content %}  {# Valid #}

{% block content %}
    <h1>Title</h1>
{% endblock %}  {# Also valid #}

{% block content %}
    <h1>Title</h1>
{% endblock wrong %}  {# Error: Block name mismatch #}
```
### Syntax Balance
```njk
{% if condition %}
    <p>Content</p>
{% endif %}  {# Valid #}
{% if condition %}
    <p>Content</p>
{% endif  {# Error: Unbalanced delimiter #}
```


### Filter Usage
```njk
{{ title | upper }}  {# Valid #}
{{ title | unknown }}  {# Error: Unknown filter #}
```

### Spacing Rules and Auto-fix
```njk
# Before fix
{{value|upper}}
{%if condition%}
{%-set name='John'-%}

# After running with --fix
{{ value | upper }}
{% if condition %}
{%- set name = 'John' -%}
```

## Auto-fix Feature
The ```--fix``` option automatically fixes spacing issues in your templates.
> **Warning:** This feature is experimental and may not cover all cases. Use with caution.

> **Note:** SyntaxeBalance en Structural fixes will be added in the future.
## Custom Filters
You can add custom filters to the linter by providing their names in the ```customFilters``` array in the configuration file.

## Contributing
Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting a pull request.

## License
This project is licensed under the MIT License.
MIT © HC