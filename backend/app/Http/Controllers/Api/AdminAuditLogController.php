<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminAuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'action' => ['nullable', 'string', 'max:100'],
            'subject_id' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);
        $logs = DB::table('audit_logs')
            ->leftJoin('users', 'users.id', '=', 'audit_logs.actor_user_id')
            ->select([
                'audit_logs.id',
                'audit_logs.actor_user_id',
                'users.name as actor_name',
                'audit_logs.action',
                'audit_logs.subject_type',
                'audit_logs.subject_id',
                'audit_logs.metadata',
                'audit_logs.created_at',
            ])
            ->when(isset($filters['action']), fn ($query) => $query->where('audit_logs.action', 'like', '%'.$filters['action'].'%'))
            ->when(isset($filters['subject_id']), fn ($query) => $query->where('audit_logs.subject_id', $filters['subject_id']))
            ->when(isset($filters['from']), fn ($query) => $query->where('audit_logs.created_at', '>=', $filters['from'].' 00:00:00'))
            ->when(isset($filters['to']), fn ($query) => $query->where('audit_logs.created_at', '<=', $filters['to'].' 23:59:59'))
            ->orderByDesc('audit_logs.id')
            ->paginate(min(max($request->integer('per_page', 50), 1), 100));

        return response()->json([
            'data' => $logs->getCollection()->map(fn (object $log) => [
                'id' => (string) $log->id,
                'actorUserId' => $log->actor_user_id === null ? null : (string) $log->actor_user_id,
                'actorName' => $log->actor_name,
                'action' => $log->action,
                'subjectType' => $log->subject_type,
                'subjectId' => $log->subject_id,
                'metadata' => json_decode($log->metadata ?? 'null', true),
                'createdAt' => Carbon::parse($log->created_at)->toISOString(),
            ]),
            'meta' => [
                'currentPage' => $logs->currentPage(),
                'lastPage' => $logs->lastPage(),
                'perPage' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
