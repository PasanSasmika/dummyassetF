export default function Avatar({ name }) {
    return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center
                        text-blue-600 font-bold text-xs shrink-0">
            {(name?.[0] || '?').toUpperCase()}
        </div>
    );
}
