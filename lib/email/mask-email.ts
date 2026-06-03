export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) {
    return "***";
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const dotIndex = domain.lastIndexOf(".");

  const maskedLocal =
    local.length <= 2
      ? `${local[0] ?? ""}***`
      : `${local.slice(0, 2)}***`;

  if (dotIndex <= 0) {
    const maskedDomain =
      domain.length <= 2 ? `${domain[0] ?? ""}***` : `${domain.slice(0, 2)}***`;
    return `${maskedLocal}@${maskedDomain}`;
  }

  const domainName = domain.slice(0, dotIndex);
  const tld = domain.slice(dotIndex);
  const maskedDomainName =
    domainName.length <= 2
      ? `${domainName[0] ?? ""}***`
      : `${domainName.slice(0, 2)}***`;

  return `${maskedLocal}@${maskedDomainName}${tld}`;
}
