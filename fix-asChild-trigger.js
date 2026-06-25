/**
 * fix-asChild-trigger.js
 *
 * Ajusta usos de asChild onde o child (ex: <Button>) tem múltiplos filhos
 * e causa problemas com forwardRef. Envolve os filhos do child em:
 *   <span className="flex items-center">...</span>
 *
 * Exporta module.exports e module.exports.default para compatibilidade.
 */

function transform(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // encontra JSXElements que tenham um atributo 'asChild'
  root.find(j.JSXElement, {
    openingElement: {
      attributes: (attrs) =>
        Array.isArray(attrs) && attrs.some(a => a && a.type === 'JSXAttribute' && a.name && a.name.name === 'asChild')
    }
  }).forEach(path => {
    const children = path.value.children.filter(c => !(c.type === 'JSXText' && c.value.trim() === ''));

    // esperamos que haja exatamente 1 filho -- o componente que receberá as props (ex: <Button>)
    if (!children || children.length !== 1) return;

    const child = children[0];
    if (child.type !== 'JSXElement') return; // se não for JSXElement (p.ex. expressão), não mexer

    // filtra os filhos reais do child (descarta textos vazios)
    const childInner = child.children ? child.children.filter(c => !(c.type === 'JSXText' && c.value.trim() === '')) : [];

    if (!childInner || childInner.length <= 1) return; // nada a fazer se 0 ou 1 filho

    // criar <span className="flex items-center"> ...childInner... </span>
    const span = j.jsxElement(
      j.jsxOpeningElement(
        j.jsxIdentifier('span'),
        [ j.jsxAttribute(j.jsxIdentifier('className'), j.literal('flex items-center')) ],
        false
      ),
      j.jsxClosingElement(j.jsxIdentifier('span')),
      childInner,
      false
    );

    // substituir os filhos internos do elemento filho por apenas o span
    child.children = [span];
  });

  return root.toSource({ quote: 'single' });
}

module.exports = transform;
module.exports.default = transform;
