<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportPageContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportPageController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->content()->toArray()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'introduction' => ['required', 'string', 'max:2000'],
            'message' => ['required', 'string', 'max:5000'],
            'support_email' => ['nullable', 'email', 'max:255'],
            'support_phone' => ['nullable', 'string', 'max:40'],
            'working_hours' => ['nullable', 'string', 'max:200'],
            'faqs' => ['present', 'array', 'max:20'],
            'faqs.*.question' => ['required', 'string', 'max:200'],
            'faqs.*.answer' => ['required', 'string', 'max:2000'],
        ]);

        $content = SupportPageContent::query()->updateOrCreate(
            ['id' => 1],
            $data,
        );

        return response()->json(['data' => $content->toArray()]);
    }

    private function content(): SupportPageContent
    {
        return SupportPageContent::query()->findOrFail(1);
    }
}
