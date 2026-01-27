import path from "path";
import fs from "fs";
import Handlebars from "handlebars";

const baseTemplateSource = fs.readFileSync(
  path.join(__dirname, "templates", "base-template.hbs"),
  "utf-8",
);
Handlebars.registerPartial("base_template", baseTemplateSource);

function renderTemplate(templateName: string, variables: {}) {
  const data = {
    logoUrl: "https://example.com/logo.png",
    imageUrl: "https://example.com/reset-pasword.png",
    companyName: "Resultz",
    supportUrl: "https://example.com/support",
    socialIcons: [
      {
        url: "https://facebook.com",
        imgSrc:
          "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/facebook@2x.png",
        alt: "Facebook",
      },
      {
        url: "https://facebook.com",
        imgSrc:
          "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/facebook@2x.png",
        alt: "Facebook",
      },
      {
        url: "https://twitter.com",
        imgSrc:
          "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/twitter@2x.png",
        alt: "Twitter",
      },
      {
        url: "https://tiktok.com",
        imgSrc:
          "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/tiktok@2x.png",
        alt: "Tiktok",
      },
    ],
    companyWebsite: "https://example.com",
    preferenceUrl: "https://example.com/preferences",
    unsubscribeUrl: "https://example.com/unsubscribe",
  };

  const newData = { ...data, ...variables };
  const templateSource = fs.readFileSync(
    path.join(__dirname, "templates", `${templateName}.hbs`),
  );
  const template = Handlebars.compile(templateSource);
  return template(newData);
}

export default renderTemplate;
