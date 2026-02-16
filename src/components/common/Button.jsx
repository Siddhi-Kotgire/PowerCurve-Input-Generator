const Button = ({
  onClick,
  disabled,
  children,
  variant = "primary",
  className = "",
}) => {
  const variants = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/50",
    secondary: "bg-blue-500 text-zinc-100 hover:bg-blue-600",
    tertiary:
      "bg-zinc-700 text-zinc-100 hover:bg-zinc-600 border border-zinc-600",
    ghost: "bg-zinc-700 text-zinc-100 hover:bg-slate-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
